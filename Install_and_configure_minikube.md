1. Install docker:
    ``` sh
    curl https://raw.githubusercontent.com/kirs-kirill/test/refs/heads/main/install_docker.sh | bash
    ```
2. Docker postinstall:
    ``` sh
    sudo groupadd docker
    sudo usermod -aG docker $USER
    newgrp docker
    ```
3. Install minikube and cubectl:
    ``` sh
    curl https://raw.githubusercontent.com/kirs-kirill/test/refs/heads/main/install_minikube.sh | bash
    ```
4. For external access to dashboard setup proxy (use your external IP or `0.0.0.0` for all IP's):
    ``` sh
    kubectl proxy --address='0.0.0.0' --accept-hosts='^*$'
    ```
5. Dashboard
    ```
    http://{IP}:8001/api/v1/namespaces/kubernetes-dashboard/services/http:kubernetes-dashboard:/proxy/#/workloads?namespace=default
    ```
