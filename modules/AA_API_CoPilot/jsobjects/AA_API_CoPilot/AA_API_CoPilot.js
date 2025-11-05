export default {

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
	
	async getInitForm(automationId,token) {
    let response = await AA_GetCoPilotInitForm.run({ automationId: automationId , token :token});
		return response
	},
	
		async getAutomation(token) {
    let response = await AA_GetCoPilotProcesses.run({ token :token});
		
		const processes = Object.values(response.automationDetails).map(process => ({
			code: process.id,
			name: process.name
		}));
		return processes
	},
	
	

	
}
