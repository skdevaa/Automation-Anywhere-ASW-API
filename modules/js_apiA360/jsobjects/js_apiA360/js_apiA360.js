export default {
	/**
	 * Global configuration for authentication, runner context, and polling behavior.
	 *
	 * @property {string} token - Auth token obtained after successful authentication.
	 * @property {Object|string} username - Username used for authentication (if applicable).
	 * @property {Object|string} apikey - API key used for authentication (if applicable).
	 * @property {string|number} runner - Runner ID used for automation execution.
	 * @property {number} maxTries - Max polling attempts for execution status.
	 * @property {number} pollUnattended - Polling interval (ms) for unattended executions.
	 * @property {number} pollHeadless - Polling interval (ms) for headless executions.
	 */
	config: {
		token: "",
		username: {},
		apikey: {},
		runner: "",
		maxTries: 20,
		pollUnattended: 5000,
		pollHeadless: 1500
	},

	
	/**
	 * Configure polling-related timeouts.
	 *
	 * @param {number} maxTries - Maximum number of polling attempts.
	 * @param {number} pollUnattended - Interval in ms between unattended status checks.
	 * @param {number} pollHeadless - Interval in ms between headless status checks.
	 * @returns {void}
	 */
	setTimeout(maxTries, pollUnattended, pollHeadless) {
		this.config.maxTries = maxTries;
		this.config.pollUnattended = pollUnattended;
		this.config.pollHeadless = pollHeadless;
	},

	/**
	 * Authenticate and set the authorization token using either API key or password.
	 *
	 * If `apikey` is provided (non-empty), API-key auth is used.
	 * Otherwise, if `password` is provided (non-empty), password auth is used.
	 *
	 * @param {string} username - Username for authentication.
	 * @param {string} apikey - API key used with AA_Authenticate_ApiKey.
	 * @param {string} password - Password used with AA_Authenticate_Pwd.
	 * @returns {Promise<void>} Resolves when the token has been set.
	 */
	async setToken(username, apikey, password) {
		if (apikey != null && apikey !== "") {
			await qry_authenticateApikey_XT.run({ user: username, apiKey: apikey });
			this.config.token = qry_authenticateApikey_XT.data.token;
		} else if (password != null && password !== "") {
			await qry_authenticatePwd_XT.run({ user: username, password: password });
			this.config.token = qry_authenticatePwd_XT.data.token;
		}
	},

	/**
	 * Get the current authorization token.
	 *
	 * @returns {string} The stored auth token.
	 */
	getToken() {
		return this.config.token;
	},

	/**
	 * Set the runner ID used for subsequent automation executions.
	 *
	 * @param {string|number} runnerid - Runner ID to be stored.
	 * @returns {void}
	 */
	setRunnerId(runnerid) {
		this.config.runner = runnerid;
	},

	/**
	 * Get the currently configured runner ID.
	 *
	 * @returns {string|number} The stored runner ID.
	 */
	getRunnerId() {
		return this.config.runner;
	},

	/**
	 * Extract the deployment ID from a deployment response.
	 *
	 * @param {Object} deploymentResponse - Response object from a deployment API.
	 * @param {string|number} deploymentResponse.deploymentId - Deployment identifier.
	 * @returns {string|number} The deployment ID.
	 */
	getDeploymentId(deploymentResponse) {
		return deploymentResponse.deploymentId;
	},

	/**
	 * Extract the deployment status from a deployment status response.
	 *
	 * @param {Object} deploymentStatusResponse - Response object containing deployment status list.
	 * @param {Array} deploymentStatusResponse.list - List of deployment status entries.
	 * @returns {string|undefined} The status of the first deployment entry, if available.
	 */
	getDeploymentStatus(deploymentStatusResponse) {
		return deploymentStatusResponse.list?.[0]?.status;
	},

	/**
	 * Extract the execution ID from a deployment status response.
	 *
	 * @param {Object} deploymentStatusResponse - Response object containing deployment status list.
	 * @param {Array} deploymentStatusResponse.list - List of deployment status entries.
	 * @returns {string|number|undefined} The execution ID of the first entry, if available.
	 */
	getExecutionId(deploymentStatusResponse) {
		return deploymentStatusResponse.list?.[0]?.id;
	},

	/**
	 * Extract bot output variables from an execution status response.
	 *
	 * @param {Object} executionStatusResponse - Response object from execution status API.
	 * @returns {*} The bot output variables payload.
	 */
	getExecutionOutput(executionStatusResponse) {
		return executionStatusResponse.botOutVariables;
	},

	/**
	 * Extract realtime execution output from a realtime execution response.
	 *
	 * @param {Object} executionRealtimeResponse - Response object from realtime execution API.
	 * @returns {*} The realtime bot output payload.
	 */
	getRealtimeExecutionOutput(executionRealtimeResponse) {
		return executionRealtimeResponse.hotBotResult.botOutput;
	},

	/**
	 * Convert a table response into an array of JSON objects (row-based).
	 *
	 * Expects:
	 * {
	 *   schema: [{ name: string, ... }, ...],
	 *   rows: [{ values: [{ string: string|null, ... }, ...] }, ...]
	 * }
	 *
	 * @param {Object} table - Table object with schema and rows.
	 * @param {Array} table.schema - Column definitions, each with a `name` field.
	 * @param {Array} table.rows - Row objects, each with a `values` array.
	 * @returns {Array<Object>} Array of row objects keyed by column name.
	 */
	convertTableToJSON(table) {
		const columns = table.schema.map(col => col.name);

		return table.rows.map(row => {
			const obj = {};
			row.values.forEach((val, i) => {
				obj[columns[i]] = val.string || null; // use .string for STRING type
			});
			return obj;
		});
	},

	/**
	 * Convert a key-value "dictionary" array into a flat JSON object.
	 *
	 * Expects:
	 * [{ key: string, value: { string: string } }, ...]
	 *
	 * @param {Array<Object>} dictionary - Array of key/value entries.
	 * @returns {Object} Flattened object with key-value pairs.
	 */
	convertDictionaryToJSON(dictionary) {
		return dictionary.reduce((obj, item) => {
			obj[item.key] = item.value.string;
			return obj;
		}, {});
	},

	/**
	 * Execute an automation in different modes.
	 *
	 * Dispatches to:
	 * - executeAutomationHeadless for "headless"
	 * - executeAutomationUnattended for "unattended"
	 * - executeAutomationRealtime for "realtime"
	 *
	 * @param {string} automationName - Name of the automation to execute.
	 * @param {"headless"|"unattended"|"realtime"} type - Execution mode.
	 * @param {string} user - Username used for authentication.
	 * @param {string} apiKey - API key used for authentication.
	 * @param {string|number} runnerId - ID of the runner to use.
	 * @param {string|number} botId - ID of the bot to run (headless/unattended).
	 * @param {string|number} [poolId] - Device pool ID (unattended only).
	 * @param {number|string} [priority] - Priority for unattended jobs.
	 * @param {Object|string|null} [botInputJSON] - Bot input payload; "" or null treated as {}.
	 * @param {string} [repositoryPath] - Repository path (realtime only).
	 * @returns {Promise<*>} Result of the execution, depending on type.
	 * @throws {Error} If type is not specified or unsupported.
	 */

	async executeAutomation(
		automationName,
		type,
		user,
		apiKey,
		runnerId,
		botId,
		poolId,
		priority,
		botInputJSON,
		repositoryPath
	) {
		botInputJSON = (botInputJSON === "" || botInputJSON === null || botInputJSON === undefined) ? "" : botInputJSON;
		poolId = (poolId === "" || poolId === null || poolId === undefined) ? "" : poolId;
		repositoryPath = (repositoryPath === "" || repositoryPath === null || repositoryPath === undefined) ? "" : repositoryPath;
		debugger;
		switch (type) {
			case "headless":
				this.setToken(user, apiKey);
				this.setRunnerId(runnerId);
				return await this.executeAutomationHeadless(automationName, botId, botInputJSON);

			case "unattended":
				this.setToken(user, apiKey);
				this.setRunnerId(runnerId);
				return await this.executeAutomationUnattended(
					automationName,
					botId,
					poolId,
					botInputJSON,
					priority
				);

			case "realtime":
				this.setToken(user, apiKey);
				this.setRunnerId(runnerId);
				return await this.executeAutomationRealtime(repositoryPath, botInputJSON);

			default:
				throw new Error("type not specified");
		}
	},

	/**
	 * Execute a headless automation and wait for completion.
	 *
	 * - Deploys the automation.
	 * - Polls deployment status until COMPLETED/RUN_FAILED/DEPLOY_FAILED/STOPPED or timeout.
	 * - Fetches and returns the execution output.
	 *
	 * Polling behavior uses:
	 *   - this.config.maxTries
	 *   - this.config.pollHeadless
	 *
	 * @param {string} automationName - Name of the headless automation.
	 * @param {string|number} botId - Bot ID to run.
	 * @param {Object|string} botInputJSON - Input payload for the bot.
	 * @returns {Promise<*>} Execution output variables.
	 * @throws {Error} On failure, stop, or polling timeout.
	 */
	async executeAutomationHeadless(automationName, botId, botInputJSON) {
		let response = await qry_headlessAutomation_XT.run({
			automationName,
			botId,
			botInputJSON,
			token: this.config.token,
			runnerId: this.config.runner
		});

		const deploymentId = this.getDeploymentId(response);

		let tries = 0;
		const maxTries = this.config.maxTries;
		let status = this.getDeploymentStatus(response);

		while (status !== "COMPLETED") {
			if (status === "RUN_FAILED") throw new Error("Execution failed.");
			if (status === "DEPLOY_FAILED") throw new Error("Deployment failed.");
			if (status === "STOPPED") throw new Error("Deployment failed.");
			if (tries++ >= maxTries) throw new Error("Polling timed out.");

			await wait(this.config.pollHeadless);
			response = await qry_deploymentStatus_XT.run({
				deploymentId,
				token: this.config.token
			});
			status = this.getDeploymentStatus(response);
		}

		const executionID = this.getExecutionId(response);
		const executionResponse = await qry_executionStatus_XT.run({
			executionId: executionID,
			token: this.config.token
		});

		return this.getExecutionOutput(executionResponse);

		/**
		 * Delay helper used for polling.
		 *
		 * @param {number} ms - Milliseconds to wait.
		 * @returns {Promise<void>}
		 */
		function wait(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}
	},

	/**
	 * Execute an unattended automation and wait for completion.
	 *
	 * - Deploys the unattended automation.
	 * - Polls deployment status until COMPLETED/RUN_FAILED/DEPLOY_FAILED/STOPPED or timeout.
	 * - Fetches and returns the execution output.
	 *
	 * Polling behavior uses:
	 *   - this.config.maxTries
	 *   - this.config.pollUnattended
	 *
	 * @param {string} automationName - Name of the unattended automation.
	 * @param {string|number} botId - Bot ID to run.
	 * @param {string|number} poolId - Device pool ID.
	 * @param {Object|string} botInputJSON - Input payload for the bot.
	 * @param {number|string} priority - Automation priority.
	 * @returns {Promise<*>} Execution output variables.
	 * @throws {Error} On failure, stop, or polling timeout.
	 */
	async executeAutomationUnattended(automationName, botId, poolId, botInputJSON, priority) {
		let response = await qry_unattendedAutomatin_XT.run({
			automationName: automationName,
			botId: botId,
			botInputJSON: botInputJSON,
			runnerId: this.config.runner,
			automationPriority: priority,
			token: this.config.token,
			devicePoolId: poolId,
			deviceUsageType: "RUN_ONLY_ON_DEFAULT_DEVICE"
		});

		const deploymentId = this.getDeploymentId(response);

		let tries = 0;
		const maxTries = this.config.maxTries;
		let status = this.getDeploymentStatus(response);

		while (status !== "COMPLETED") {
			if (status === "RUN_FAILED") throw new Error("Execution failed.");
			if (status === "DEPLOY_FAILED") throw new Error("Deployment failed.");
			if (status === "STOPPED") throw new Error("Deployment failed.");
			if (tries++ >= maxTries) throw new Error("Polling timed out.");

			await wait(this.config.pollUnattended);
			response = await qry_deploymentStatus_XT.run({
				deploymentId,
				token: this.config.token
			});
			status = this.getDeploymentStatus(response);
		}

		const executionID = this.getExecutionId(response);
		const executionResponse = await qry_executionStatus_XT.run({
			executionId: executionID,
			token: this.config.token
		});

		return this.getExecutionOutput(executionResponse);

		/**
		 * Delay helper used for polling.
		 *
		 * @param {number} ms - Milliseconds to wait.
		 * @returns {Promise<void>}
		 */
		function wait(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}
	},

	/**
	 * Execute a realtime automation.
	 *
	 * - Retrieves a realtime execution URL & token.
	 * - Calls the realtime execution endpoint with the provided input.
	 * - Returns the realtime execution output.
	 *
	 * @param {string} repositoryPath - Path to the repository/bot.
	 * @param {Object|string} botInputJSON - Input payload for the realtime execution.
	 * @returns {Promise<*>} Realtime execution output.
	 */
	async executeAutomationRealtime(repositoryPath, botInputJSON) {
		let response = await qry_getRealtimeURL_XT.run({
			repositoryPath: repositoryPath,
			token: this.config.token
		});

		const accessDetails = response.accessDetails;
		const key = Object.keys(accessDetails)[0]; // dynamic key
		const url = accessDetails[key].url;
		const realtimetoken = accessDetails[key].headers["X-Authorization"];

		response = await qry_realtimeExecution.run({
			executionURL: url,
			realtimeToken: realtimetoken,
			botInputJSON: botInputJSON
		});

		return this.getRealtimeExecutionOutput(response);
	}
};
