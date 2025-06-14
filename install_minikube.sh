# install minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube_latest_amd64.deb
sudo dpkg -i minikube_latest_amd64.deb

# add autocompletion
sudo apt-get install bash-completion
source /etc/bash_completion
source <(minikube completion bash) 

# install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# add autocompletion
kubectl completion bash | sudo tee /etc/bash_completion.d/kubectl > /dev/null
newgrp
