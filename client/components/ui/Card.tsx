
import Image from 'next/image'

export default function Card({title,body,image,expanded, expandClick,index}) {
  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }
  return (
    <div className='border rounded-lg p-3 bg-white border-transparent relative'>
      <div className='w-full'>
       <Image alt={title} src={image} width="400" height="300" className="h-[300px] w-full mr-2" />
      </div>
      <div className='min-h-[150px] px-5 mt-3 pb-8 flex flex-col'>
        <h5 className='text-base-500 text-h5'>{title}</h5>
        { body.map((text, i) => (
            <p key={i} className='mt-2 text-base-400 text-body'>
              {text}
            </p>      
          ))
        }

        {/* { body.map((text, i) => (
            <p key={i} className={classNames('mt-2 text-base-400 text-body',i !== 0 && !expanded ? 'hidden':'')}>
              {text}
            </p>      
          ))
        }
        <button className='text-blue-500 text-left absolute bottom-2' onClick={() => expandClick(!expanded, index)}>Ver {expanded ? 'menos': 'más'}</button> */}
      </div>
    </div>
  )
}
