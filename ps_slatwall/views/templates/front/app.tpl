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
        // Definiujemy zmienną PRZED załadowaniem skryptu
        var sl_catalog_url = "{$catalog_url|escape:'javascript':'UTF-8'}";
        console.log('Konfigurator: URL katalogu ustawiony na:', sl_catalog_url);
    </script>
    
    {if isset($base_url)}
        <script src="{$base_url}{$module_uri}assets/js/app.js" defer></script>
    {else}
        <script src="{$module_uri}assets/js/app.js" defer></script>
    {/if}
{/block}

