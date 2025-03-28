#!/bin/bash
sudo apt update

echo "----------------------"
echo "Instal snapd"
echo "----------------------"
sudo apt install snapd -y

echo "----------------------"
echo "Instal microk8s"
echo "----------------------"
sudo snap install microk8s --classic

echo "----------------------"
echo "Set rights"
echo "----------------------"
mkdir ~/.kube
sudo usermod -a -G microk8s $USER
sudo chown -f -R $USER ~/.kube
microk8s config > ~/.kube/config

microk8s status --wait-ready
echo "----------------------"
echo "Set cert"
echo "----------------------"
sudo microk8s refresh-certs --cert front-proxy-client.crt

echo "----------------------"
echo "Instal kubectl"
echo "----------------------"
curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/linux/amd64/kubectl
chmod +x ./kubectl
sudo mv ./kubectl /usr/local/bin/kubectl
source <(kubectl completion bash)
echo "source <(kubectl completion bash)" >> ~/.bashrc

echo "----------------------"
echo "DONE!"
echo "----------------------"
