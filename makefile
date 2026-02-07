deploy/stage :
        git pull origin stage
        npm install
        npm run build
        sudo systemctl restart ze-stage

deploy/prod :
        git pull origin main
        npm install
        npm run build
        sudo systemctl restart ze-backend
