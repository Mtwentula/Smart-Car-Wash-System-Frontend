pipeline {
    agent any

    environment {
        DEPLOY_PATH = '/var/www/html'   // change if needed
    }

    stages {

        stage('Checkout') {
            steps {
                git url: 'https://github.com/Lintshiwe/Smart-Car-Wash-System-Frontend.git', branch: 'main'
            }
        }

        stage('Validate') {
            steps {
                echo 'Validating website...'
                script {
                    if (!fileExists('index.html')) {
                        error('index.html not found!')
                    }
                }
            }
        }

        stage('Prepare Deployment') {
            steps {
                echo 'Cleaning deployment directory...'
                sh "rm -rf ${DEPLOY_PATH}/*"
            }
        }

        stage('Deploy Website') {
            steps {
                echo 'Deploying website files...'
                sh "cp -r * ${DEPLOY_PATH}/"
            }
        }

        stage('Set Permissions') {
            steps {
                sh "chmod -R 755 ${DEPLOY_PATH}"
            }
        }

    }

    post {
        success {
            echo '✅ Website deployed successfully!'
        }
        failure {
            echo '❌ Deployment failed.'
        }
    }
}
