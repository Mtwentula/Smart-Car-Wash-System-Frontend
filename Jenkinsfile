pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                git url: 'https://github.com/Lintshiwe/Smart-Car-Wash-System-Frontend.git', branch: 'main'
            }
        }

        stage('Validate') {
            steps {
                echo 'Validating static website files...'

                script {
                    if (!fileExists('index.html')) {
                        error('❌ index.html not found. Make sure it exists in the root directory.')
                    }
                }
            }
        }

        stage('List Files') {
            steps {
                echo 'Listing project files...'
                sh 'ls -la'
            }
        }

        stage('Archive Website') {
            steps {
                archiveArtifacts artifacts: '**/*.html, **/*.css, **/*.js', fingerprint: true
            }
        }

        stage('Serve (Optional)') {
            steps {
                echo 'Starting temporary local server on port 8080...'

                sh '''
                    nohup python3 -m http.server 8080 > server.log 2>&1 &
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Static site pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline failed. Check logs above.'
        }
    }
}
