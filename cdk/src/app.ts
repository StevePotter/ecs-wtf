#!/usr/bin/env node
import { App } from 'aws-cdk-lib'
import { EcsStack } from './ecs-stack'

const app = new App()
const serviceStack = new EcsStack(app, "simple-service-fargate")
