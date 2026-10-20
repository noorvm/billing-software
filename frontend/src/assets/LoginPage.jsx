import { useState } from "react"
import { useNavigate } from "react-router-dom";
import "./LoginPage.css"

function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    async function Login(e, username, password) {
        e.preventDefault();

        try {
            const response = await fetch("https://billing-software-xqyb.onrender.com/login",{
                method:"POST",
                headers:{
                    "Content-Type":"application/json"
                },
                body: JSON.stringify({
                    username: username,
                    password: password
                })
            });
            const result = await response.json();

            if(!response.ok){
                const errorMessage = result.detail || `Login Failed(${response.status})`;
                throw new Error(errorMessage);
            }

            console.log(result.message);
            alert(result.message);
            localStorage.setItem("usertype", result.usertype);
            localStorage.setItem("username", result.username);
            if (result.usertype === "admin"){
                navigate("/admin")
            }else if (result.usertype === "staff") {
                navigate("/staff")
            }else{
                alert("Login creditional failed \n try again");
            }
            // want to add local storage and navigate function

        } catch (error) {
            console.log("Login Failed", error);
            alert(error.message)
        } 
    }

    return (
        
        <div className="login-wrapper">
            <div className="login-card">
                <h2>Login Portal</h2>
                <p>Staff & Admin</p>
                <form className="login-form" onSubmit={(e)=>Login(e, username, password)}>
                    <input 
                    className="login-input"
                    placeholder="Enter the username"
                    value={username}
                    onChange={(e)=> setUsername(e.target.value)}
                    required
                    />
                    <br />
                    <input 
                    type="password"
                    className="login-input"
                    placeholder="Enter the password"
                    value={password}
                    onChange={(e)=> setPassword(e.target.value)}
                    /><br />
                    <button className="login-submit-btn" type="submit">Login</button>
                </form>
            </div>
        </div>
    )
}

export default LoginPage