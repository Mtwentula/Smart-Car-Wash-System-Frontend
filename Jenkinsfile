pipeline {
    agent any

    parameters {
        booleanParam(
            name: 'RUN_TESTS',
            defaultValue: true,
            description: 'Run frontend tests?'
        )
        booleanParam(
            name: 'DEPLOY_PRODUCTION',
            defaultValue: false,
            description: 'Deploy this build to production'
        )
        string(
            name: 'PROD_DEPLOY_CMD',
            defaultValue: '',
            description: 'Shell command used to deploy frontend to production target'
        )
    }

    environment {
        PROJECT = 'carwash-frontend'
        TEAM = 'lintshiwe'
        STACK = 'nodejs'
        APP_DIR = '/opt/carwash-frontend'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
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

        stage('Install') {
            steps {
                echo "📦 Installing dependencies..."
                sh 'npm install'
            }
        }

        stage('Build') {
            steps {
                echo "🔨 Building frontend..."
                sh 'npm run build'
            }
        }

        stage('Test') {
            when { expression { params.RUN_TESTS == true } }
            steps {
                echo "🧪 Running tests..."
                sh 'npm test'
            }
        }

        stage('Validate') {
            steps {
                echo 'Validating static frontend structure...'
                sh 'test -f public/index.html'
                sh 'test -f src/App.js'
            }
        }

        stage('Package') {
            steps {
                echo 'Packaging static frontend artifact...'
                sh '''#!/bin/bash
rm -rf dist
mkdir -p dist
cp -r build/* dist/
tar -czf carwash-frontend-static.tar.gz -C dist .
'''
            }
        }

        stage('Approve Production') {
            when {
                expression {
                    return params.DEPLOY_PRODUCTION && (env.BRANCH_NAME == null || env.BRANCH_NAME == 'main')
                }
            }
            steps {
                input message: 'Deploy frontend build to PRODUCTION?', ok: 'Deploy'
            }
        }

        stage('Deploy Production') {
            when {
                expression {
                    return params.DEPLOY_PRODUCTION && (env.BRANCH_NAME == null || env.BRANCH_NAME == 'main')
                }
            }
            steps {
                script {
                    if (!params.PROD_DEPLOY_CMD?.trim()) {
                        error 'DEPLOY_PRODUCTION=true but PROD_DEPLOY_CMD is empty. Provide deployment command.'
                    }
                }
                echo '🚀 Deploying frontend to production...'
                sh '''#!/bin/bash
set -euo pipefail
eval "$PROD_DEPLOY_CMD"
'''
            }
        }
    }

    post {
        success {
            echo "✅ [${PROJECT}] Pipeline completed successfully!"
        }
        failure {
            echo "❌ [${PROJECT}] Pipeline failed!"
        }
        always {
            cleanWs()
        }
    }
}

