import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib'
import { InstanceType, InstanceClass, InstanceSize, Vpc } from 'aws-cdk-lib/aws-ec2'
import {
  Cluster,
  ContainerImage,
  Ec2Service,
  Ec2TaskDefinition,
  EcsOptimizedImage,
  AmiHardwareType,
  AwsLogDriver,
  Protocol,
  AsgCapacityProvider,
} from 'aws-cdk-lib/aws-ecs'
import { ManagedPolicy, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Construct } from 'constructs'
import { ApplicationLoadBalancer, ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import { AutoScalingGroup, GroupMetrics, HealthCheck } from 'aws-cdk-lib/aws-autoscaling'
import { ApplicationLoadBalancedEc2Service } from 'aws-cdk-lib/aws-ecs-patterns'

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
      capacity: {
        instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MEDIUM),
      }
    })

    // source: https://github.com/aws/aws-cdk/blob/c389a8be79297239f76d680301aad3aa135334d6/packages/aws-cdk-lib/aws-ecs-patterns/lib/ecs/application-load-balanced-ecs-service.ts
    // base class source: https://github.com/aws/aws-cdk/blob/c389a8be79297239f76d680301aad3aa135334d6/packages/aws-cdk-lib/aws-ecs-patterns/lib/base/application-load-balanced-service-base.ts
    const s = new ApplicationLoadBalancedEc2Service(this, 'Service', {
      cluster,
      memoryLimitMiB: 512,
      serviceName: id,
      cpu: 256,
      taskImageOptions: {
        image: ContainerImage.fromRegistry("stevepotterredefine/simple_server:latest"),
        containerPort: 5100,
        enableLogging: true,
        logDriver: AwsLogDriver.awsLogs({ streamPrefix: id }),
      },
      publicLoadBalancer: true,
    })
    s.taskDefinition.

    new CfnOutput(this, `${id}-DNS`, { value: s.loadBalancer.loadBalancerDnsName })
  }
}
