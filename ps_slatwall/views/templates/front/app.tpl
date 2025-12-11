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
        var sl_module_uri = "{$module_uri|escape:'javascript':'UTF-8'}";
        var sl_base_url = "{if isset($base_url)}{$base_url|escape:'javascript':'UTF-8'}{else}{/if}";
        // Naprawiamy &amp; na & w URL (Smarty escape'uje & do &amp; w HTML)
        var sl_ajax_url_raw = "{$ajax_url}";
        var sl_ajax_url = sl_ajax_url_raw.replace(/&amp;/g, '&');
        
        console.log('Konfigurator Config:', {
            catalog: sl_catalog_url,
            ajax: sl_ajax_url,
            ajax_raw: sl_ajax_url_raw,
            module_uri: sl_module_uri,
            base_url: sl_base_url
        });
    </script>
    
    {if isset($base_url)}
        <script src="{$base_url}{$module_uri}assets/js/build.js" defer></script>
    {else}
        <script src="{$module_uri}assets/js/build.js" defer></script>
    {/if}
{/block}

