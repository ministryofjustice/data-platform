{{/*
Create a shorthand version of the GitHub Organisation
*/}}
{{- define "actions-runner.orgShorthand" }}
{{- if eq "moj-analytical-services" .Values.github.organisation }}
{{- printf "%s" "mojas"}}
{{- else -}}
{{- printf "%s" "moj"}}
{{- end -}}
{{- end }}

{{/*
Expand the name of the chart.
*/}}
{{- define "actions-runner.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "actions-runner.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "actions-runner.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "actions-runner.labels" -}}
helm.sh/chart: {{ include "actions-runner.chart" . }}
{{ include "actions-runner.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "actions-runner.selectorLabels" -}}
app.kubernetes.io/name: {{ include "actions-runner.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "actions-runner.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "actions-runner.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
Create secret prefix
*/}}
{{- define "actions-runner.secretPrefix" -}}
{{- default (include "actions-runner.name" .) }}
{{- end }}
