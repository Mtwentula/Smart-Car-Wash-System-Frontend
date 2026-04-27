pipeline {
    agent any

    environment {
        PROJECT = 'carwash-frontend'
    }

    stages {
        stage('Checkout') {
            steps {
                echo "📥 [${PROJECT}] Pulling code..."
                git credentialsId: 'github-token',
                    url: 'https://github.com/Lintshiwe/Smart-Car-Wash-System-Frontend.git',
                    branch: 'main'
            }
        }

        stage('Validate') {
            steps {
                echo '✅ Validating static frontend files...'
                dir('Smart-Car-Wash-System-Frontend') {   // run inside repo folder
                    sh 'test -f index.html'
                    sh 'test -f style.css'
                    sh 'test -f script.js'
                }
            }
        }

        stage('Package') {
            steps {
                echo '📦 Packaging static frontend...'
                dir('Smart-Car-Wash-System-Frontend') {
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
        }

        stage('Deploy') {
            steps {
                echo '🚀 Deploying static frontend...'
                dir('Smart-Car-Wash-System-Frontend') {
                    sh '''#!/bin/bash
set -euo pipefail
cp carwash-frontend-static.tar.gz /opt/carwash-frontend/
'''
                }
            }
        }
    }

    post {
        success {
            echo "✅ [${PROJECT}] Static frontend pipeline completed!"
        }
        failure {
            echo "❌ [${PROJECT}] Pipeline failed!"
        }
        always {
            cleanWs()
        }
    }
}

