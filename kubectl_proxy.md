1. Enable proxy

    ``` sh
    kubectl proxy --address='0.0.0.0' --accept-hosts='^*$'
    ```

2. Dashbloard

    ``` http
    http://{IP}:8001/api/v1/namespaces/kubernetes-dashboard/services/http:kubernetes-dashboard:/proxy/#/workloads?namespace=default
    ```