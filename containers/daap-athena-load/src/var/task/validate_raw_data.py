from infer_glue_schema import GlueSchemaGenerator
from typing import BinaryIO
from pyarrow.csv import CSVStreamingReader
from data_platform_logging import DataPlatformLogger


def validate_csv(csv_file: BinaryIO, schema_columns: dict, logger: DataPlatformLogger):
    """
    Validate that the CSV data matches the registered schema.
    Note that this does not perform row-by-row data quality checks on the schema. This validation
    just ensures that the data producer has uploaded the right format of file so we can proceed
    with the ingestion.
    """
    generator = GlueSchemaGenerator(logger=logger)
    inferred_schema = generator.infer_from_raw_csv(
        bytes_stream=csv_file,
        table_name="abc",
        database_name="abc",
        table_location="abc",
    ).glue_metadata

    expected_column_names = {column["Name"] for column in schema_columns}
    actual_columns = {
        column["Name"]: column["Type"]
        for column in inferred_schema["TableInput"]["StorageDescriptor"]["Columns"]
    }
    actual_column_names = set(actual_columns.keys())

    if expected_column_names != actual_column_names:
        logger.info(f"Expected {expected_column_names}, got {actual_column_names}")
        return False

    for column in schema_columns:
        column_type = column["Type"]
        inferred_type = actual_columns[column["Name"]]
        if column_type != inferred_type:
            return False

    return True


def type_matches(expected_type: str, actual_type: str):
    """
    TODO: what exceptions should we make here?
    """
    return expected_type == actual_type
