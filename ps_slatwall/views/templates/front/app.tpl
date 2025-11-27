{extends file='page.tpl'}

{block name='page_content'}
    <div id="slatwall-root" class="container" data-catalog-url="{$catalog_url|escape:'html':'UTF-8'}">
        <h1>Ładowanie konfiguratora Slatwall...</h1>
    </div>

    {* Ładujemy CSS i JS bezpośrednio w szablonie - pewne rozwiązanie *}
    {if isset($base_url)}
        <link rel="stylesheet" href="{$base_url}{$module_uri}assets/css/style.css">
    {else}
        <link rel="stylesheet" href="{$module_uri}assets/css/style.css">
    {/if}
    
    <script>
        // Definiujemy zmienne PRZED załadowaniem skryptu
        var sl_catalog_url = "{$catalog_url|escape:'javascript':'UTF-8'}";
        var sl_ajax_url = "{$ajax_url|escape:'javascript':'UTF-8'}"; // <--- DODAJ TĘ LINIĘ
        
        console.log('Konfigurator Config:', {
            catalog: sl_catalog_url,
            ajax: sl_ajax_url
        });
    </script>
    
    {if isset($base_url)}
        <script src="{$base_url}{$module_uri}assets/js/build.js" defer></script>
    {else}
        <script src="{$module_uri}assets/js/build.js" defer></script>
    {/if}
{/block}

