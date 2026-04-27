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
'''pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                git url: 'https://github.com/Lintshiwe/Smart-Car-Wash-System-Frontend.git', branch: 'main'
            }
        }

        stage('Validate Files') {
            steps {
                echo 'Checking if index.html exists...'
                script {
                    if (!fileExists('index.html')) {
                        error('index.html not found! Build failed.')
                    }
                }
            }
        }

        stage('Archive Website') {
            steps {
                archiveArtifacts artifacts: '**/*.html, **/*.css, **/*.js', fingerprint: true
            }
        }
    }

    post {
        success {
            echo 'Static site ready 🚀'
        }
        failure {
            echo 'Something went wrong ❌'
        }
    }
}
    }
}

