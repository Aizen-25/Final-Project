#!/usr/bin/env pwsh
# Auto-commit local changes script
# Usage:
#   ./scripts/auto-commit-local.ps1          # commit locally (no push)
#   ./scripts/auto-commit-local.ps1 -Push    # commit and push to remote

# define help parameters 
# remove this block needed 

# add parameter for pushing changes 



param(
  [switch]$Push
)

function Abort([string]$msg) {
  Write-Host "ERROR: $msg" -ForegroundColor Red
  exit 1
}

try {
  $branch = (git rev-parse --abbrev-ref HEAD).Trim()
} catch {
  Abort "Not a git repository or git not available."
}

if ($branch -eq 'main' -or $branch -eq 'stable') {
  Abort "Refusing to auto-commit on branch '$branch'. Switch to a work branch (e.g. 'local-work') first." 
}

# Stage all changes
git add -A

$msg = "WIP: auto-commit on $branch @ $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# Create a commit only if there are staged changes
$status = git status --porcelain
if (-not [string]::IsNullOrWhiteSpace($status)) {
  git commit -m $msg
  Write-Host "Committed locally on '$branch': $msg" -ForegroundColor Green
  if ($Push) {
    Write-Host "Pushing to origin/$branch..." -ForegroundColor Yellow
    git push origin $branch
  }
} else {
  Write-Host "No changes to commit." -ForegroundColor Yellow
}
