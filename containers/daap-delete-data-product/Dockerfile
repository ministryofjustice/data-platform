FROM ghcr.io/ministryofjustice/data-platform-daap-python-base:7.3.1

ARG VERSION

ENV VERSION="${VERSION}"

COPY src/var/task ${LAMBDA_TASK_ROOT}

CMD ["delete_data_product.handler"]
