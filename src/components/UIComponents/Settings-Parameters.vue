<template>
  <section class="
    bg-slate-500/60 rounded-2xl
    w-full p-2
    flex flex-col justify-center
  ">
    <span class="text-xl font-bold text-center">Parameters</span>

    <div class="my-2"> 
      <label class="
        w-full px-2 py-2
        rounded-2xl 
        grid grid-cols-3 
        hover:bg-slate-700/50
        transition-all duration-50 ease-in-out
      "><p>Seed</p>
        <input type="number" value="50" class="col-span-2 bg-slate-500 rounded-2xl px-2"/>
      </label>
    
      <label class="
        w-full px-2 py-2
        rounded-2xl 
        grid grid-cols-3 
        hover:bg-slate-700/50
        transition-all duration-50 ease-in-out
      "><p>Frequency</p>
        <input type="range" value="50" min="0" max="100" class="h"/>
        <input type="number" value="50" class="bg-slate-500 rounded-2xl px-2"/>
      </label>
    
      <label class="
        w-full px-2 py-2
        rounded-2xl 
        grid grid-cols-3 
        hover:bg-slate-700/50 transition-all duration-50 ease-in-out
      "><p>Amplitude</p>
        <input type="range" value="50" min="0" max="100"/>
        <input type="number" value="50" class="bg-slate-500 rounded-2xl px-2"/>
      </label>
    </div>

    <button class="
      w-full px-4 py-2 rounded-2xl font-bold text-center mt-auto cursor-pointer
      bg-slate-700 hover:bg-slate-900 
      transition-all duration-50 ease-in-out
    ">Generate</button>
  </section>
</template>