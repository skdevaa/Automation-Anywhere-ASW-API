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
		await AA_ActivateAgent.run({ chatId: this.config.chatId, projectId: this.config.projectid , agentId: this.config.agentId, apiKey : this.config.apikey , secret : this.config.secret })
	},



	async getAgents() {
		const response = await AA_GetAgents.run({ projectId: this.config.projectid , apiKey : this.config.apikey , secret : this.config.secret })

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
		const response = await AA_CreateChat.run({ name: name, projectId: this.config.projectid , apiKey : this.config.apikey , secret : this.config.secret });
		this.config.chatId = response.chat_id;
		return this.config.chatId
	},

	async sendMessageChat(message) {
		const response = await AA_ChatMessage.run({ chatId: this.config.chatId, message: message, projectId: this.config.projectid , apiKey : this.config.apikey, secret : this.config.secret });

		return response.message.response
	},


	async deleteChat() {
		const response = await AA_DeleteChat.run({ projectId: this.config.projectid, chatId: this.config.chatId , apiKey : this.config.apikey, secret : this.config.secret });
		return response.message
	},

	async uploadFile(file,fileType) {
		const response = await AA_UploadFile.run({ fileType: fileType, projectId: this.config.projectid, chatId: this.config.chatId, file: file , apiKey : this.config.apikey, secret : this.config.secret});
		return response.document_key
	}

}