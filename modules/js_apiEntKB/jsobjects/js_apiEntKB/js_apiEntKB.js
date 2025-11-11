export default {
	config : {
		apikey :"",
		secret : "",
		projectid: "",
		agentId: "",
		chatId : ""
	},

	setAuthHeaders(apiKey,secret) {
		this.config.apikey = apiKey;
		this.config.secret = secret;
	},

	setProjectId(projectId) {
		this.config.projectid = projectId
	},

	getProjectId() {
		return this.config.projectid
	},


	async setAgentId(agentId) {
		this.config.agentId = agentId
		await qry_activateAgent.run({ chatId: this.config.chatId, projectId: this.config.projectid , agentId: this.config.agentId, apiKey : this.config.apikey , secret : this.config.secret })
	},



	async getAgents() {
		const response = await qry_getAgents.run({ projectId: this.config.projectid , apiKey : this.config.apikey , secret : this.config.secret })

		const agents = Object.values(response.agents).map(agent => ({
			code: agent.id,
			name: agent.name
		}));

		return agents;
	},


	getAgentId() {
		return this.config.agentId 
	},


	async createChat(name) {
		const response = await qry_createChat.run({ name: name, projectId: this.config.projectid , apiKey : this.config.apikey , secret : this.config.secret });
		this.config.chatId = response.chat_id;
		return this.config.chatId
	},

	async sendMessageChat(message) {
		const response = await qry_chatMessage.run({ chatId: this.config.chatId, message: message, projectId: this.config.projectid , apiKey : this.config.apikey, secret : this.config.secret });

		return response.message.response
	},


	async deleteChat() {
		const response = await qry_deleteChat.run({ projectId: this.config.projectid, chatId: this.config.chatId , apiKey : this.config.apikey, secret : this.config.secret });
		return response.message
	},

	async uploadFile(file,fileType) {
		const response = await qry_uploadFile.run({ fileType: fileType, projectId: this.config.projectid, chatId: this.config.chatId, file: file , apiKey : this.config.apikey, secret : this.config.secret});
		return response.document_key
	}

}