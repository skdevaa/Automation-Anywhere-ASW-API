export default {
	config : {
		token: "",
		username: {},
		apikey: {},
		runner: ""
	},

  async setToken(username, apikey,password) {
		if (apikey != null && apikey !== '') {
    		await AA_Authenticate_ApiKey.run({ user: username, apiKey: apikey })
		    this.config.token = AA_Authenticate_ApiKey.data.token;
		}
				else if (password != null && password !== '') {
					 await AA_Authenticate_Pwd.run({ user: username, password: password })
		       this.config.token = AA_Authenticate_Pwd.data.token;
				}

  },

  getToken() {
    return this.config.token;
  },

  setRunnerId(runnerid) {
    this.config.runner = runnerid;
  },
  getRunnerId() {
    return this.config.runner;
  },

  getDeploymentId(deploymentResponse) {
    return deploymentResponse.deploymentId;
  },

  getDeploymentStatus(deploymentStatusResponse) {
    return deploymentStatusResponse.list?.[0]?.status;
  },

  getExecutionId(deploymentStatusResponse) {
    return deploymentStatusResponse.list?.[0]?.id;
  },

  getExecutionOutput(executionStatusResponse) {
    return executionStatusResponse.botOutVariables;
  },
	
	 getRealtimeExecutionOutput(executionRealtimeResponse) {
    return executionRealtimeResponse.hotBotResult.botOutput;
  },
	
	convertTableToJSON(table) {
    // Extract column names from schema
    const columns = table.schema.map(col => col.name);

    // Map over each row to build JSON objects
    return table.rows.map(row => {
      const obj = {};
      row.values.forEach((val, i) => {
        obj[columns[i]] = val.string || null; // use .string for STRING type
      });
      return obj;
    });
  },
	
	convertDictionaryToJSON(dictionary) {
    // Extract flat dictionary data
		return dictionary.reduce((obj, item) => {
			obj[item.key] = item.value.string;
			return obj;
		}, {});
	},
	
	
	
	/**
   * Execute an automation in different modes.
   *
   * @param {string} automationName - Name of the automation to execute.
   * @param {"headless"|"unattended"|"realtime"} type - Execution mode.
   * @param {string} user - Username used for authentication.
   * @param {string} apiKey - API key used for authentication.
   * @param {string|number} runnerId - ID of the bit runner to use (unattended only).
   * @param {string|number} botId - ID of the bot to run (headless/unattended).
   * @param {string|number} [poolId] - Device pool ID (unattended only).
   * @param {number} [priority=High] - Priority for unattended jobs.
   * @param {Object|string|null} [botInputJSON] - Bot input payload; "" or null will be treated as {}.
   * @param {string} [repositoryPath] - Repository path (realtime only).
   * @returns {Promise<*>} Result of the execution, depending on type.
   */
	
	 async executeAutomation(automationName,type, user, apiKey, runnerId,  botId, poolId, priority, botInputJSON,repositoryPath) {
	  let botInput = (botInputJSON === "" || botInputJSON == null) ? {} : botInputJSON;
		 switch (type) {
			 case "headless":
				 								this.setToken(user,apiKey);
				 								this.setRunnerId(runnerId);
				 								return await this.executeAutomationHeadless(automationName,botId,botInput);
			case "unattended":
				 								this.setToken(user,apiKey);
				 								this.setRunnerId(runnerId);
				 								return await this.executeAutomationUnattended(automationName, botId, poolId, botInputJSON,priority);
			case "realtime":
				 								this.setToken(user,apiKey);
				 								this.setRunnerId(runnerId);
				 								return await this.executeAutomationRealtime(repositoryPath,botInputJSON);
			default:
    										throw new Error("type not specified");
				 
		 }
		 
	 },

  async executeAutomationHeadless(automationName, botId, botInputJSON) {
    let response = await AA_DeployHeadlessAutomation.run({
      automationName,
      botId,
      botInputJSON,
      token: this.config.token,
			runnerId : this.config.runner
    });

    const deploymentId = this.getDeploymentId(response);

    // Poll until completed (add a small delay + max tries to avoid tight/infinite loops)
    let tries = 0;
    const maxTries = 15;
		var status = this.getDeploymentStatus(response) ;
    while (status !== "COMPLETED") {
			if (status === "FAILED") throw new Error("Execution failed.");
			if (status === "STOPPED") throw new Error("Execution stopped.");
      if (tries++ >= maxTries) throw new Error("Polling timed out.");
			await wait(1000)
      response = await AA_DeploymentStatus.run({ deploymentId, token: this.config.token });
			status = this.getDeploymentStatus(response) ;
    }

    const executionID = this.getExecutionId(response);
    const executionResponse = await AA_ExecutionStatus.run({
      executionId: executionID,
      token: this.config.token,
			
    });

    return this.getExecutionOutput(executionResponse);
		
		function wait(ms) {
     return new Promise(resolve => setTimeout(resolve, ms));
    }
		
  },
	
	  async executeAutomationUnattended(automationName, botId, poolId, botInputJSON,priority) {
    let response = await AA_DeployUnattendedAutomation.run({ 
			automationName: automationName, 
			botId: botId, 
			botInputJSON: botInputJSON, 
			runnerId: this.config.runner,
			automationPriority: priority, 
			token:this.config.token, 
			devicePoolId: poolId, 
			deviceUsageType: "RUN_ONLY_ON_DEFAULT_DEVICE" });

    const deploymentId = this.getDeploymentId(response);

    // Poll until completed (add a small delay + max tries to avoid tight/infinite loops)
    let tries = 0;
    const maxTries = 20;
		var status = this.getDeploymentStatus(response) ;
    while (status !== "COMPLETED") {
			if (status === "FAILED") throw new Error("Execution failed.");
			if (status === "STOPPED") throw new Error("Execution stopped.");
      if (tries++ >= maxTries) throw new Error("Polling timed out.");
			await wait(5000)
      response = await AA_DeploymentStatus.run({ deploymentId, token: this.config.token });
			status = this.getDeploymentStatus(response) ;
    }

    const executionID = this.getExecutionId(response);
    const executionResponse = await AA_ExecutionStatus.run({
      executionId: executionID,
      token: this.config.token,
			
    });

    return this.getExecutionOutput(executionResponse);
		
		function wait(ms) {
     return new Promise(resolve => setTimeout(resolve, ms));
    }
		
  },
	
		async executeAutomationRealtime(repositoryPath,botInputJSON) {
		   	let response = await AA_GetRealtimeURL.run({ repositoryPath: repositoryPath, token : this.config.token})	;
				const accessDetails = response.accessDetails;
				const key = Object.keys(accessDetails)[0]; // dynamic key
				const url = accessDetails[key].url;
				const realtimetoken =accessDetails[key].headers["X-Authorization"];	
			
			 response = await AA_RealtimeExecution.run({ executionURL: url, realtimeToken: realtimetoken, botInputJSON: botInputJSON })
			
			return this.getRealtimeExecutionOutput(response)
		}
   };