FROM ghcr.io/ministryofjustice/data-platform-daap-python-base:8.0.0
ARG VERSION

ENV VERSION="${VERSION}"

COPY src/var/task ${LAMBDA_TASK_ROOT}

RUN python -m pip install --no-cache-dir --upgrade pip==23.3.1 \
    && python -m pip install --no-cache-dir --requirement requirements.txt

CMD ["athena_load_handler.handler"]
