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
                sh 'test -f index.html'
                sh 'test -f styles.css'
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
cp styles.css dist/
cp script.js dist/
tar -czf carwash-frontend-static.tar.gz -C dist .
'''
            }
        }

        stage('Deploy') {
            when { expression { params.DEPLOY_PRODUCTION == true } }
            steps {
                echo '🚀 Deploying static frontend...'
                sh '''#!/bin/bash
set -euo pipefail
# Example deploy command
cp carwash-frontend-static.tar.gz /opt/carwash-frontend/
'''
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

