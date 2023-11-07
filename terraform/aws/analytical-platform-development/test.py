import boto3
from datetime import datetime as dt
import pandas as pd
import awswrangler as wr

boto3.setup_default_session(region_name="eu-west-2")

now = dt.now()
current_date = dt.strftime(now.date(), "%d/%m/%Y")

query = f"""fields detail.data.user_id as user, detail.data.user_name as email
| filter detail.data.type = "s"
| filter detail.data.connection = "github"
| stats max(@timestamp) as last_login by "{current_date}" as effective_date, user, email
| sort last_login desc
"""
year = dt.now().year
current_month = dt.now().month
previous_month = current_month - 1
if previous_month == 0:
    previous_month = 12
    year = year - 1

end_datetime = dt.now()
start_datetime = dt(year, previous_month, 1, 0, 0, 0)

dataframe = wr.cloudwatch.read_logs(
    log_group_names=['/aws/events/auth0/alpha-analytics-moj'],
    query=query,
    start_time=start_datetime,
    end_time=end_datetime,
)

dataframe['last_login'] = pd.to_datetime(dataframe['last_login'], format="%Y-%m-%d %H:%M:%S.%f").apply(lambda x: str(x.date()))

dataframe.to_excel('test.xlsx', index=False)
