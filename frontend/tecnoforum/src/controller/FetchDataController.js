import Axios from 'axios';

export default class FetchDataController
{
	static getUserslist (object)
	{
		Axios({
			method: 'GET',
			mode: "cors",
			url: '/api/users',
			responseType: 'json'
		}).then((response) => {
			object.setState({
				list:response.data
			});
		}).catch(error => {
			console.log("Server responded with an error:",error);
		});
	}

	static getUserByName (object, name)
	{
		Axios({
			method: 'GET',
			mode: "cors",
			url: `/api/users/name/${name}`,
			responseType: 'json'
		}).then((response) => {
			object.setState({
				user:response.data
			});
		}).catch(error => {
			console.log("Server responded with an error:",error);
		});
	}
}