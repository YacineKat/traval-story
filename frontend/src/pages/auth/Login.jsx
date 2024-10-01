import React from 'react'

const Login = () => {
  return (
    <div className='h-screen bg-cyan-50 overflow-hidden relative'>
      <div className="countainer h-screen flex items-center justify-center px-20 mx-auto">
        <div className="w-2/4 h-[90vh] flex items-end bg-login-bg-img bg-cover bg-center rounded-lg p-10 z-50">
          <div>
            <h4 className='text-5xl text-white  font-semibold leading-[58px]'>
              Captur Your <br/>Journeys
            </h4>
            <p className='text-[15px] text-white leading-6 pr-7 mt-4'>
              Record your travel experiences and memories in your personal 
              traverl journal.
            </p>
          </div>
        </div>
        <div className='w-2/4 h-[75vh] bg-white rounded-r-lg relative p-16 shadow-cyan-200/20'>
          <form onSubmit={() => {}}>
            <h4 className="text-2xl font-semibold mb-7">Login</h4>
            <input type="text" placeholder='Email'  className="input-box" />
            <button type='submit' className="btn-primary">
              LOGIN
            </button>
            <p className="">Or</p>
            <button type='submit' className="" onClick={() => {
              navigate('/signUp')
            }} >
              CREATE ACCOUNT
            </button>

          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
