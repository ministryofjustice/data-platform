import json
import uuid
from datetime import datetime
from pathlib import PurePath

import boto3
from data_platform_logging import DataPlatformLogger
from data_platform_paths import DataProductElement

s3 = boto3.client("s3")

logger = DataPlatformLogger()


def handler(event, context):
    logger.info(f"event: {event}")
    data_product_name = event["pathParameters"].get("data-product-name")
    table_name = event["pathParameters"].get("table-name")
    body = json.loads(event.get("body"))
    md5 = str(body.get("contentMD5"))
    filename = body.get("filename")
    amz_date = datetime.utcnow()
    uuid_value = uuid.uuid4()

    if (
        not isinstance(data_product_name, str)
        or not isinstance(table_name, str)
        or not isinstance(filename, str)
    ):
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(
                {
                    "error": {
                        "message": "data product name, table name or filename are not"
                        + " convertible to string type."
                    }
                }
            ),
        }

    file_extension = PurePath(filename).suffix
    if file_extension != ".csv":
        return {
            "statusCode": 400,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"error": {"message": "Invalid file extension."}}),
        }

    element = DataProductElement.load(
        data_product_name=data_product_name, element_name=table_name
    )
    data_product = element.data_product
    landing_data_path = element.landing_data_path(
        timestamp=amz_date, uuid_value=uuid_value, file_extension=file_extension
    )

    logger.add_data_product(data_product_name=data_product_name, table_name=table_name)

    logger.info(f"s3 path: {landing_data_path}")
    logger.info(f"data_product_name: {data_product_name}")
    logger.info(f"table_name: {table_name}")
    logger.info(f"amz_date: {amz_date}")
    logger.info(f"md5: {md5}")
    logger.info(f"uuid_string: {uuid_value}")
    logger.info(f"event: {event}")

    # Check the data product has been registered, ie has metadata in s3
    data_product_registration = s3.list_objects_v2(
        Bucket=data_product.metadata_path().bucket,
        Prefix=data_product.metadata_path().key,
    ).get("Contents", [])

    if not any(data_product_registration):
        return {
            "statusCode": 404,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps(
                {
                    "error": {
                        "message": "Data product registration relating"
                        + " to database not found."
                    }
                }
            ),
        }

    fields = {
        "x-amz-server-side-encryption": "AES256",
        "x-amz-acl": "bucket-owner-full-control",
        "Content-MD5": md5,
        "Content-Type": "binary/octet-stream",
    }
    # File upload is capped at 5GB per single upload so
    # content-length-range is 5GB
    conditions = [
        {"x-amz-server-side-encryption": "AES256"},
        {"x-amz-acl": "bucket-owner-full-control"},
        {"Content-MD5": md5},
        ["starts-with", "$Content-MD5", ""],
        ["starts-with", "$Content-Type", ""],
        ["starts-with", "$key", landing_data_path.key],
        ["content-length-range", 0, 5000000000],
    ]

    URL = s3.generate_presigned_post(
        Bucket=landing_data_path.bucket,
        Key=landing_data_path.key,
        Fields=fields,
        Conditions=conditions,
        ExpiresIn=200,
    )
    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"URL": URL}),
    }
