import React from 'react'

export default function  TextInput({type, value,onChange}) {
  return (
    <div>
        <input type={type} value={value} onChange={onChange} />
    </div>
  )
}
