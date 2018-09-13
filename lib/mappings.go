package lib

const IndexUserJSON = `{
	"mapper":{
		 "dynamic":false
	},
	"settings":{
		 "index":{
				"analysis":{
					 "analyzer":{
							"keyword_lowercase":{
								 "tokenizer":"keyword",
								 "filter":"lowercase"
							}
					 }
				}
		 }
	},
	"mappings":{
		 "user":{
				"properties":{
					"user_id":{
							"type":"keyword"
					},
					"email":{
							"type":"keyword"
					},
					"password_hash":{
							"type":"binary"
					},
					"verify_token":{
						"type":"keyword"
					},
					"reset_token":{
						"type":"keyword"
					}
					"create_date":{
							"type":"date"
					},
					"last_login_date":{
							"type":"date"
					}
				}
		 }
	}
}`

const IndexJournalJSON = `{
	"mapper":{
		 "dynamic":false
	},
	"settings":{
		 "index":{
				"analysis":{
					 "analyzer":{
							"keyword_lowercase":{
								 "tokenizer":"keyword",
								 "filter":"lowercase"
							}
					 }
				}
		 }
	},
	"mappings":{
		"journal":{  
			"properties":{  
				"user_id":{  
					"type":"keyword"
				},
				"entries":{  
					"type":"text",
					"analyzer":"english"
				},
				"create_date":{  
					"type":"date"
				},
				"date":{  
					"type":"date"
				}
			}
	  }
	}
}`

const IndexVerifyJSON = `{
	"mapper":{
		 "dynamic":false
	},
	"settings":{
		 "index":{
				"analysis":{
					 "analyzer":{
							"keyword_lowercase":{
								 "tokenizer":"keyword",
								 "filter":"lowercase"
							}
					 }
				}
		 }
	},
	"mappings":{
		"verify":{
			"properties":{
				"email":{
					"type":"keyword"
				},
				"token":{
					"type":"keyword"
				},
				"password_hash":{
					"type":"binary"
				},
				"create_date":{
					"type":"date"
				}
			}
	  }
	}
}`

const IndexPwResetJSON = `{
	"mapper":{
		 "dynamic":false
	},
	"settings":{
		 "index":{
				"analysis":{
					 "analyzer":{
							"keyword_lowercase":{
								 "tokenizer":"keyword",
								 "filter":"lowercase"
							}
					 }
				}
		 }
	},
	"mappings":{
		"pwreset":{
			"properties":{
			  "user_id":{
					"type":"keyword"
			  },
			  "token":{
					"type":"keyword"
			  },
			  "create_date":{
					"type":"date"
			  }
			}
	  }
	}
}`