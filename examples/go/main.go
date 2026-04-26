// Minimal Go handler for the branch-beacon endpoint.
//
// Mount on /api/dev/git-branch. Returns {"branch": string|null}. Returns
// null on any failure — the component renders nothing in that case.

package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os/exec"
	"strings"
	"time"
)

type response struct {
	Branch *string `json:"branch"`
}

func gitBranch(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	// Override Dir on the cmd if your server starts from a subdirectory.
	cmd := exec.CommandContext(ctx, "git", "rev-parse", "--abbrev-ref", "HEAD")
	out, err := cmd.Output()
	if err != nil {
		json.NewEncoder(w).Encode(response{Branch: nil})
		return
	}

	branch := strings.TrimSpace(string(out))
	if branch == "" {
		json.NewEncoder(w).Encode(response{Branch: nil})
		return
	}
	json.NewEncoder(w).Encode(response{Branch: &branch})
}

func main() {
	http.HandleFunc("/api/dev/git-branch", gitBranch)
	log.Println("branch-beacon endpoint: http://localhost:8080/api/dev/git-branch")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
