<script>
  import { onMount } from 'svelte';

	let MyComponent;

	onMount(async () => {
		const module = await import('./index.svelte')
		MyComponent = module.default
	})

</script>

<svelte:component this={MyComponent} {...$$props} />
