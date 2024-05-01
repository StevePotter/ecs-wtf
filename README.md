# Why doesn't this work?

This repo is a simplified version of an application I'm building.  In the real application, I need GPU-backed instances because the docker image has an ML model that requires it.  So I can't use Fargate.  All this does is define a super simple web app on ECS backed by EC2 instances.  I can't make it any simpler.  It deploys but fails health checks.  Please help!

Try it out:
```
cd cdk
npm install
npm run cdk deploy
```

## About Docker

The original application has a github action that builds and deploys the docker image to a private ECR repo.  I simplified it by pushing the docker image to dockerhub.  But I included the dockerfile if you're interested.  The code is in `app/main.py`.  To start it:

```
docker compose up
```
And visit localhost:8001
