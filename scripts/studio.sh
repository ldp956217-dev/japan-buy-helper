#!/bin/sh
export PATH="/Users/chenzifang/.nvm/versions/node/v20.20.2/bin:$PATH"
cd "/Users/chenzifang/Desktop/VS Code/My Project"
exec node node_modules/prisma/build/index.js studio --port 5555
