FROM ghcr.io/ministryofjustice/data-platform-daap-python-base:8.1.1

ARG VERSION

ENV VERSION="${VERSION}"

COPY src/var/task ${LAMBDA_TASK_ROOT}

CMD ["delete_table.handler"]
