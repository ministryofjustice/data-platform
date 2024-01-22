"""
Integration test that runs against a development OpenMetadata server.

Run with:
export API_URL='https://catalogue.apps-tools.development.data-platform.service.justice.gov.uk/api'
export JWT_TOKEN=******
poetry run pytest tests/test_integration_with_server.py
"""

import os

import pytest
from data_platform_catalogue import DataProductMetadata, TableMetadata
from data_platform_catalogue.client import OpenMetadataCatalogueClient
from data_platform_catalogue.entities import DataLocation

jwt_token = os.environ.get("JWT_TOKEN")
api_url = os.environ.get("API_URL", "")
runs_on_development_server = pytest.mark.skipif("not jwt_token or not api_url")


@runs_on_development_server
def test_upsert_test_hierarchy():
    client = OpenMetadataCatalogueClient(jwt_token=jwt_token, api_url=api_url)

    assert client.is_healthy()

    data_product = DataProductMetadata(
        name="my_data_product",
        description="bla bla",
        version="v1.0.0",
        owner="7804c127-d677-4900-82f9-83517e51bb94",
        email="justice@justice.gov.uk",
        retention_period_in_days=365,
        domain="legal-aid",
        dpia_required=False,
    )

    data_product_schema = DataProductMetadata(
        name="Tables",
        description="All the tables contained within my_data_product",
        version="v1.0.0",
        owner="7804c127-d677-4900-82f9-83517e51bb94",
        email="justice@justice.gov.uk",
        retention_period_in_days=365,
        domain="legal-aid",
        dpia_required=False,
    )

    table = TableMetadata(
        name="my_table",
        description="bla bla",
        column_details=[
            {"name": "foo", "type": "string", "description": "a"},
            {"name": "bar", "type": "int", "description": "b"},
        ],
        retention_period_in_days=365,
    )

    service_fqn = client.upsert_database_service(name="data_platform")
    assert service_fqn == "data_platform"

    database_fqn = client.upsert_database(
        metadata=data_product, location=DataLocation(service_fqn)
    )
    assert database_fqn == "data_platform.my_data_product"

    schema_fqn = client.upsert_schema(
        metadata=data_product_schema, location=DataLocation(database_fqn)
    )
    assert schema_fqn == "data_platform.my_data_product.Tables"

    table_fqn = client.upsert_table(metadata=table, location=DataLocation(schema_fqn))
    assert table_fqn == "data_platform.my_data_product.Tables.my_table"