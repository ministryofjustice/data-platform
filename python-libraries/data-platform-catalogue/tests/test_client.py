import json

import pytest
from data_platform_catalogue.client import (
    DataHubCatalogueClient,
    OpenMetadataCatalogueClient,
    ReferencedEntityMissing,
)
from data_platform_catalogue.entities import (
    CatalogueMetadata,
    DataProductMetadata,
    TableMetadata,
)
from datahub.configuration.common import OperationalError


class TestCatalogueClient:
    def mock_service_response(self, fqn):
        return {
            "fullyQualifiedName": fqn,
            "id": "39b855e3-84a5-491e-b9a5-c411e626e340",
            "name": "foo",
            "serviceType": "Glue",
        }

    def mock_database_response(self, fqn):
        return {
            "fullyQualifiedName": fqn,
            "id": "39b855e3-84a5-491e-b9a5-c411e626e340",
            "name": "foo",
            "service": {
                "id": "39b855e3-84a5-491e-b9a5-c411e626e340",
                "type": "Glue",
            },
        }

    def mock_schema_response(self, fqn):
        return {
            "fullyQualifiedName": fqn,
            "id": "39b855e3-84a5-491e-b9a5-c411e626e340",
            "name": "foo",
            "service": {
                "id": "39b855e3-84a5-491e-b9a5-c411e626e340",
                "type": "Glue",
            },
            "database": {
                "id": "39b855e3-84a5-491e-b9a5-c411e626e340",
                "type": "",
            },
        }

    def mock_table_response_omd(self):
        return {
            "fullyQualifiedName": "some-table",
            "id": "39b855e3-84a5-491e-b9a5-c411e626e340",
            "name": "foo",
            "service": {
                "id": "39b855e3-84a5-491e-b9a5-c411e626e340",
                "type": "Glue",
            },
            "database": {
                "id": "39b855e3-84a5-491e-b9a5-c411e626e340",
                "type": "",
            },
            "databaseSchema": {
                "id": "39b855e3-84a5-491e-b9a5-c411e626e340",
                "type": "",
            },
            "columns": [],
        }

    def mock_table_response_datahub(self):
        response = {
            "proposal": {
                "entityType": "dataset",
                "entityUrn": "urn:li:dataset:(urn:li:dataPlatform:glue,some-table,PROD)",
                "changeType": "UPSERT",
                "aspectName": "schemaMetadata",
                "aspect": {
                    "value": '{"schemaName": "some-table", "platform": "urn:li:dataPlatform:glue", "version": 1, "created": {"time": 0, "actor": "urn:li:corpuser:unknown"}, "lastModified": {"time": 0, "actor": "urn:li:corpuser:unknown"}, "hash": "", "platformSchema": {"com.linkedin.schema.OtherSchema": {"rawSchema": "__insert raw schema here__"}}, "fields": [{"fieldPath": "foo", "nullable": false, "description": "a", "type": {"type": {"com.linkedin.schema.StringType": {}}}, "nativeDataType": "string", "recursive": false, "isPartOfKey": false}, {"fieldPath": "bar", "nullable": false, "description": "b", "type": {"type": {"com.linkedin.schema.NumberType": {}}}, "nativeDataType": "int", "recursive": false, "isPartOfKey": false}]}',  # noqa E501
                    "contentType": "application/json",
                },
            }
        }

        return response

    def mock_user_response(self, fqn):
        return {
            "email": "justice@justice.gov.uk",
            "id": "39b855e3-84a5-491e-b9a5-c411e626e340",
        }

    @pytest.fixture
    def catalogue(self):
        return CatalogueMetadata(
            name="data_platform",
            description="All data products hosted on the data platform",
            owner="2e1fa91a-c607-49e4-9be2-6f072ebe27c7",
        )

    @pytest.fixture
    def data_product(self):
        return DataProductMetadata(
            name="my_data_product",
            description="bla bla",
            version="v1.0.0",
            owner="2e1fa91a-c607-49e4-9be2-6f072ebe27c7",
            email="justice@justice.gov.uk",
            retention_period_in_days=365,
            domain="legal-aid",
            dpia_required=False,
            tags=["test"],
        )

    @pytest.fixture
    def table(self):
        return TableMetadata(
            name="my_table",
            description="bla bla",
            column_details=[
                {"name": "foo", "type": "string", "description": "a"},
                {"name": "bar", "type": "int", "description": "b"},
            ],
            retention_period_in_days=365,
        )

    @pytest.fixture
    def omd_client(self, requests_mock) -> OpenMetadataCatalogueClient:
        requests_mock.get(
            "http://example.com/api/v1/system/version",
            json={"version": "1.2.0.1", "revision": "1", "timestamp": 0},
        )

        return OpenMetadataCatalogueClient(
            jwt_token="abc", api_url="http://example.com/api"
        )

    @pytest.fixture
    def datahub_client(self, requests_mock) -> DataHubCatalogueClient:
        requests_mock.get(
            "http://example.com/api/gms/config",
            json={
                "models": {},
                "patchCapable": True,
                "versions": {
                    "linkedin/datahub": {
                        "version": "v0.12.1",
                        "commit": "990bb65fec7f1fa6f5dee0445499481c6d93220c",
                    }
                },
                "managedIngestion": {"defaultCliVersion": "0.12.1", "enabled": True},
                "statefulIngestionCapable": True,
                "supportsImpactAnalysis": True,
                "timeZone": "GMT",
                "telemetry": {"enabledCli": True, "enabledIngestion": False},
                "datasetUrnNameCasing": False,
                "retention": "true",
                "datahub": {"serverType": "quickstart"},
                "noCode": "true",
            },
        )

        return DataHubCatalogueClient(
            jwt_token="abc",
            api_url="http://example.com/api/gms",
        )

    def test_create_service_omd(self, omd_client, requests_mock):
        requests_mock.put(
            "http://example.com/api/v1/services/databaseServices",
            json=self.mock_service_response("some-service"),
        )

        fqn = omd_client.upsert_database_service()

        assert requests_mock.last_request.json() == {
            "name": "data-platform",
            "displayName": "Data platform",
            "serviceType": "Glue",
            "connection": {"config": {}},
        }
        assert fqn == "some-service"

    def test_create_database_omd(self, request, omd_client, requests_mock, catalogue):
        requests_mock.put(
            "http://example.com/api/v1/databases",
            json=self.mock_database_response("some-db"),
        )

        fqn: str = omd_client.upsert_database(
            metadata=catalogue, service_fqn="data-platform"
        )
        assert requests_mock.last_request.json() == {
            "name": "data_platform",
            "displayName": None,
            "domain": None,
            "lifeCycle": None,
            "description": "All data products hosted on the data platform",
            "tags": [],
            "owner": {
                "id": "2e1fa91a-c607-49e4-9be2-6f072ebe27c7",
                "type": "user",
                "name": None,
                "fullyQualifiedName": None,
                "description": None,
                "displayName": None,
                "deleted": None,
                "href": None,
            },
            "service": "data-platform",
            "default": False,
            "retentionPeriod": None,
            "extension": None,
            "sourceUrl": None,
        }
        assert fqn == "some-db"

    def test_create_schema(self, request, omd_client, requests_mock, data_product):
        requests_mock.put(
            "http://example.com/api/v1/databaseSchemas",
            json=self.mock_schema_response("some-schema"),
        )

        fqn = omd_client.upsert_schema(
            metadata=data_product, database_fqn="data-product"
        )
        assert requests_mock.last_request.json() == {
            "name": "my_data_product",
            "displayName": None,
            "domain": None,
            "lifeCycle": None,
            "description": "bla bla",
            "owner": {
                "deleted": None,
                "description": None,
                "displayName": None,
                "fullyQualifiedName": None,
                "href": None,
                "id": "2e1fa91a-c607-49e4-9be2-6f072ebe27c7",
                "name": None,
                "type": "user",
            },
            "database": "data-product",
            "tags": [
                {
                    "description": None,
                    "displayName": None,
                    "name": None,
                    "href": None,
                    "labelType": "Automated",
                    "source": "Classification",
                    "state": "Confirmed",
                    "style": None,
                    "tagFQN": "test",
                }
            ],
            "retentionPeriod": "P365D",
            "extension": None,
            "sourceUrl": None,
        }
        assert fqn == "some-schema"

    def test_create_table_omd(self, request, omd_client, requests_mock, table):
        requests_mock.put(
            "http://example.com/api/v1/tables",
            json=self.mock_table_response_omd(),
        )

        fqn = omd_client.upsert_table(
            metadata=table, schema_fqn="data-platform.data-product.schema"
        )
        assert requests_mock.called
        assert requests_mock.last_request.json() == {
            "name": "my_table",
            "displayName": None,
            "domain": None,
            "lifeCycle": None,
            "description": "bla bla",
            "dataProducts": None,
            "tableType": None,
            "columns": [
                {
                    "name": "foo",
                    "displayName": None,
                    "dataType": "STRING",
                    "arrayDataType": None,
                    "dataLength": None,
                    "precision": None,
                    "scale": None,
                    "dataTypeDisplay": None,
                    "description": "a",
                    "fullyQualifiedName": None,
                    "tags": None,
                    "constraint": None,
                    "ordinalPosition": None,
                    "jsonSchema": None,
                    "children": None,
                    "customMetrics": None,
                    "profile": None,
                },
                {
                    "name": "bar",
                    "displayName": None,
                    "dataType": "INT",
                    "arrayDataType": None,
                    "dataLength": None,
                    "precision": None,
                    "scale": None,
                    "dataTypeDisplay": None,
                    "description": "b",
                    "fullyQualifiedName": None,
                    "tags": None,
                    "constraint": None,
                    "ordinalPosition": None,
                    "jsonSchema": None,
                    "children": None,
                    "customMetrics": None,
                    "profile": None,
                },
            ],
            "tableConstraints": None,
            "tablePartition": None,
            "tableProfilerConfig": None,
            "owner": None,
            "databaseSchema": "data-platform.data-product.schema",
            "tags": [],
            "viewDefinition": None,
            "retentionPeriod": "P365D",
            "extension": None,
            "sourceUrl": None,
            "fileFormat": None,
        }
        assert fqn == "some-table"

    def test_create_table_datahub(self, request, datahub_client, requests_mock, table):
        requests_mock.post(
            "http://example.com/api/gms/aspects?action=ingestProposal",
            json=self.mock_table_response_datahub(),
        )

        # this method makes 2 calls to 'graph.emit()', first is to update dataset, second is to update tags
        fqn = datahub_client.upsert_table(metadata=table)
        fqn_out = "urn:li:dataset:(urn:li:dataPlatform:glue,my_table,PROD)"

        aspects_count = sum(
            [
                path == "/api/gms/aspects"
                for path in [request.path for request in requests_mock.request_history]
            ]
        )

        assert requests_mock.called
        if table.tags:
            assert aspects_count == 2
            response_json = requests_mock.request_history[-2].json()
            assert requests_mock.last_request.json()["proposal"]["entityUrn"] == fqn_out
        else:
            assert aspects_count == 1
            response_json = requests_mock.last_request.json()
        assert (
            json.loads(response_json["proposal"]["aspect"]["value"])["schemaName"]
            == "my_table"
        )
        assert response_json["proposal"]["entityUrn"] == fqn_out
        assert fqn == fqn_out

    def test_404_handling_omd(self, request, omd_client, requests_mock, table):
        requests_mock.put(
            "http://example.com/api/v1/tables",
            status_code=404,
            json={"code": "something", "message": "something"},
        )

        with pytest.raises(ReferencedEntityMissing):
            omd_client.upsert_table(
                metadata=table, schema_fqn="data-platform.data-product.schema"
            )

    def test_404_handling_datahub(self, request, datahub_client, requests_mock, table):
        requests_mock.post(
            "http://example.com/api/gms/aspects?action=ingestProposal",
            status_code=404,
            json={"code": "something", "message": "something"},
        )

        with pytest.raises(OperationalError):
            datahub_client.upsert_table(metadata=table)

    def test_get_user_id(self, request, requests_mock, omd_client):
        requests_mock.get(
            "http://example.com/api/v1/users/name/justice",
            json={
                "email": "justice@justice.gov.uk",
                "name": "justice",
                "id": "39b855e3-84a5-491e-b9a5-c411e626e340",
            },
        )

        user_id = omd_client.get_user_id("justice@justice.gov.uk")

        assert "39b855e3-84a5-491e-b9a5-c411e626e340" in str(user_id)
