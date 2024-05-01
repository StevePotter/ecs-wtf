import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib'
import { Vpc } from 'aws-cdk-lib/aws-ec2'
import {
  Cluster,
  ContainerImage,
  FargateService,
  FargateTaskDefinition,
  AwsLogDriver,
  Protocol,
} from 'aws-cdk-lib/aws-ecs'
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import { ApplicationLoadBalancer, ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2'

export class EcsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    // Define the VPC
    const vpc = new Vpc(this, 'Vpc', {
      vpcName: id,
      maxAzs: 3,
    })

    // Define the ECS Cluster
    const cluster = new Cluster(this, 'EcsCluster', {
      clusterName: id,
      vpc,
    })

    const logging = new AwsLogDriver({ streamPrefix: id }) 

    // Create an IAM Role for ECS tasks
    const ecsTaskExecutionRole = new Role(this, 'TaskExecutionRole', {
      roleName: `${id}-container`,
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role for the ECS container.',
    })
    // Attach policies to the role
    ecsTaskExecutionRole.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'))

    // Define the ECS Task Definition
    const taskDefinition = new FargateTaskDefinition(this, 'TaskDef', {
      executionRole: ecsTaskExecutionRole,
      cpu: 256, // 0.25 vCPU
      memoryLimitMiB: 512,
    })

    const containerPort = 5100
    const containerName = 'web'
    const container = taskDefinition.addContainer('AppContainer', {
      containerName,
      image: ContainerImage.fromRegistry("stevepotterredefine/simple_server:latest"),      
      logging,
    })

    container.addPortMappings({
      containerPort,
      protocol: Protocol.TCP,
    })

    // Define the ECS Service
    const service = new FargateService(this, 'EcsService', {
      cluster,
      taskDefinition,
      serviceName: id,
    })

    // Define the ALB
    const alb = new ApplicationLoadBalancer(this, 'LoadBalancer', {
      vpc,
      internetFacing: true,
      deletionProtection: false, // so it can be easily deleted
      loadBalancerName: id,
    })

    // Attach the ALB to the ECS Service
    const listener = alb.addListener('PublicListener', {
      port: 80,
      open: true,
    })
    listener.addTargets('ECS', {
      protocol: ApplicationProtocol.HTTP,
      targetGroupName: id,
      targets: [
        service.loadBalancerTarget({
          containerName,
          containerPort,
        }),
      ],
    })

    new CfnOutput(this, `${id}-DNS`, { value: alb.loadBalancerDnsName })
  }
}