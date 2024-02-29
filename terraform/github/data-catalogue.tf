module "data_catalogue_team" {
  source = "./modules/team"

  name        = "data-catalogue"
  description = "Data Catalogue Team"
  members = [
    "jemnery",         # Jeremy Collins
    "seanprivett",     # Sean Privett
    "YvanMOJdigital",  # Yvan Smith
    "LavMatt",         # Matt Laverty
    "murdo-moj",       # Murdo Moyse
    "tom-webber",      # Tom Webber
    "mitchdawson1982", # Mitch Dawson
    "MatMoore",        # Mat Moore
  ]
}

module "data_catalogue_repository" {
  source = "./modules/repository"

  name        = "data-catalogue"
  description = "Data Catalogue"
  topics      = ["data-catalogue"]

  use_template        = true
  template_repository = "data-platform-app-template"
  has_projects        = "true"
  homepage_url        = null

  access = {
    admins = [module.data_catalogue_team.id]
  }
}

module "data_catalogue_metadata" {
  source = "./modules/repository"

  name        = "data-catalogue-metadata"
  description = "Data Catalogue Metadata"
  topics      = ["data-catalogue"]
  visibility  = "internal"

  use_template = false
  has_projects = "true"
  homepage_url = null

  advanced_security_status               = "disabled"
  secret_scanning_status                 = "disabled"
  secret_scanning_push_protection_status = "disabled"

  access = {
    admins = [module.data_catalogue_team.id]
  }
}

moved {
  from = module.data_catalogue_metadata
  to   = module.data_catalogue_metadata_repository
}