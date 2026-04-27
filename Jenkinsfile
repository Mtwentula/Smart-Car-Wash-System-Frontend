stage('Validate') {
    steps {
        echo '✅ Validating static frontend files...'
        sh 'test -f index.html'
        sh 'test -f style.css'
        sh 'test -f script.js'
    }
}

stage('Package') {
    steps {
        echo '📦 Packaging static frontend...'
        sh '''#!/bin/bash
rm -rf dist
mkdir -p dist
cp index.html dist/
cp style.css dist/
cp script.js dist/
tar -czf carwash-frontend-static.tar.gz -C dist .
'''
    }
}

