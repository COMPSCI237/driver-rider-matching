Tutorial on Deploy an Application from GitHub Using AWS CodeDeploy

1. Provision an Amazon EC2 Instance follow the instruction: http://docs.aws.amazon.com/codedeploy/latest/userguide/how-to-use-cloud-formation-template.html

2. SSH to EC2 Instance
  ssh -i /path/my-key-pair.pem ec2-user@public_dns_name

3. Install Node on EC2 Instance
  <!-- sudo yum update -->
  cd ~
  curl https://nodejs.org/dist/latest/node-v6.2.1-linux-x64.tar.gz >node.tgz
  tar xzf node.tgz
  export PATH="$PATH:(your install dir)/(node dir)/bin"
  npm install -g npm
  sudo ln -s /home/ec2-user/node-v6.2.1-linux-x64/bin/node /usr/bin/node
  sudo ln -s /home/ec2-user/node-v6.2.1-linux-x64/bin/npm /usr/bin/npm

4. Deploy the Application to the EC2 Instance follow the instruction: http://docs.aws.amazon.com/codedeploy/latest/userguide/github-integ-tutorial.html#github-integ-tutorial-deploy
  Run server as root: sudo node server.js


Other useful commands:
  Create self-signed certificate with openssl:
    openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365
