rm -f .git/hooks/pre-push
rm -f .git/hooks/post-checkout
rm -f .git/hooks/post-commit
rm -f .git/hooks/post-merge
npm rebuild husky

echo "command -v git-lfs >/dev/null 2>&1 || { echo >&2 \"This repository is configured for Git LFS but 'git-lfs' was not found on your path. If you no longer wish to use Git LFS, remove this hook by deleting .git/hooks/pre-push.\"; exit 2; }; \
git lfs pre-push \"\$@\"" >> .git/hooks/pre-push

echo "command -v git-lfs >/dev/null 2>&1 || { echo >&2 \"This repository is configured for Git LFS but 'git-lfs' was not found on your path. If you no longer wish to use Git LFS, remove this hook by deleting .git/hooks/post-checkout.\"; exit 2; }; \
git lfs post-checkout \"\$@\"" >> .git/hooks/post-checkout

echo "command -v git-lfs >/dev/null 2>&1 || { echo >&2 \"This repository is configured for Git LFS but 'git-lfs' was not found on your path. If you no longer wish to use Git LFS, remove this hook by deleting .git/hooks/post-commit.\"; exit 2; }; \
git lfs post-commit \"\$@\"" >> .git/hooks/post-commit

echo "command -v git-lfs >/dev/null 2>&1 || { echo >&2 \"This repository is configured for Git LFS but 'git-lfs' was not found on your path. If you no longer wish to use Git LFS, remove this hook by deleting .git/hooks/post-merge.\"; exit 2; }; \
git lfs post-merge \"\$@\"" >> .git/hooks/post-merge
