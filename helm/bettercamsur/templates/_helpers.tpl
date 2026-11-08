{{- define "bettercamsur.name" -}}{{ default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}{{- end -}}
{{- define "bettercamsur.fullname" -}}{{ if .Values.fullnameOverride }}{{ .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}{{ else }}{{ printf "%s-%s" .Release.Name (include "bettercamsur.name" .) | trunc 63 | trimSuffix "-" }}{{ end }}{{- end -}}
{{- define "bettercamsur.labels" -}}
app.kubernetes.io/name: {{ include "bettercamsur.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}
