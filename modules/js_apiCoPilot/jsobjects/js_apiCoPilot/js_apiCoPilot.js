export default {

	// !! DO NOT USE - Experimental


	async getInitForm(automationId,token) {
		let response = await qry_getCPinitform_XT.run({ automationId: automationId , token :token});
		return response
	},

	async getAutomation(token) {
		let response = await qry_getCPProcesses_XT.run({ token :token});

		const processes = Object.values(response.automationDetails).map(process => ({
			code: process.id,
			name: process.name
		}));
		return processes
	},
	
		async newInstance(token,processId,processInputJSON) {
		let response = await qry_startCPProcess_XT.run({ token, processId,processInputJSON })

		return response.id
	},


	 async getInstances(token,filterOperand,titleFilter,statusFilter) {
		 let response = await qry_getCPInstances_XT.run({ token: token, filterOperand: filterOperand, statusFilter: statusFilter, titleFilter: titleFilter })

		return response.list

	},
	
		async getInstanceDetails(token,instanceId) {
			let response = await qry_getCPInstanceDetails_XT.run({ token: token, instanceId : instanceId })
			return {title:response.title,steps: this.extractTaskDetails(response.steps),status: response.status}

	},
	
	
	 async getTaskDetails(token,taskId) {
			let response = await qry_getCPTaskDetails.run({ token: token, taskId: taskId });
			return {title:response.title,inputs: response.inputs,outputs: response.outputs, status: response.stepState, controls : this.extractKeys(response.controls)}

	},
	
		 async submitTask(token,instanceId,taskId,formInput, button) {
			let response = await qry_submitCPTask_XT.run({ token, instanceId, taskId, formInput , button })
      return response

	},
	
		 async getNotifications(token) {
			let response = await qry_getCPNotifications.run({ token })
      return response
	},
	
	
	
	
	
	
	// Helpers
	
	
	
	extractLabelValues(data) { 

		const formObj = typeof data.form === "string" ? JSON.parse(data.form) : data.form;
		const result = {};
		const rows = formObj?.form?.rows || [];

		rows.forEach(row => {
			(row.columns || []).forEach(col => {
				if (col.label !== undefined && col.defaultValue !== undefined) {
					result[col.label] = col.defaultValue;
				}
			});
		});
		return result;
	},
	
	extractTaskDetails(data) {
		return data
			// keep only items whose name does NOT start with "NOASW_"
			.filter(s => !s.name?.startsWith('NOASW_'))
			.map(s => ({
				id: s.id,
				name: s.name,
				type: s.type,
			  createdOn: s.createdOn,
			  submittedOn: s.submittedOn,
				updatedOn: s.updatedOn,
				stepState: s.stepState,
				executionStatus: s.executionStatus
			}));
	
	},
	
		extractKeys(data) {
			const keys = data.map(c => c.key);
		 return keys;
	},
	
	
		localDateFormat(dateStr,locale) {
			try {
				if (dateStr === "") return "";
				const normalized = dateStr
														.replace(/\[.*\]$/, "")                        // "2025-11-23T10:40:59.149051Z"
														.replace(/\.(\d{3})\d*Z$/, ".$1Z");            // "2025-11-23T10:40:59.149Z"

				var options = { year: 'numeric', month: '2-digit', day: '2-digit' , hour : "2-digit",  minute : "2-digit",  second : "2-digit"};
				var date  = new Date(normalized);

				return date.toLocaleDateString(locale,options)
			}
			catch {
				 return ""
			}

		}
	
	
	



}
