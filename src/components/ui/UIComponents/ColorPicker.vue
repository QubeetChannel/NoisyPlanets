<template>
  <div
    class="w-8 h-8 rounded-md border-2 border-black cursor-pointer"
    :style="{ backgroundColor: color }"
    @click="open"
  />

  <input
    ref="input"
    type="color"
    class="hidden"
    :value="color"
    @input="update"
  />
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  const props = defineProps({
    modelValue: { type: String, required: true }
  });
  const emit = defineEmits(['update:modelValue']);

  const input = ref(null);

  function open() {
    input.value?.click();
  }

  function update(e) {
    emit('update:modelValue', e.target.value);
  }
</script>
