FROM ghcr.io/ministryofjustice/data-platform-daap-python-base:7.0.0

ARG VERSION

ENV VERSION="${VERSION}"

COPY src/var/task ${LAMBDA_TASK_ROOT}

RUN python -m pip install --no-cache-dir --upgrade pip==23.2.1 \
    && python -m pip install --no-cache-dir --requirement requirements.txt

CMD ["presigned_url.handler"]
