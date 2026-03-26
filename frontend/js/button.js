document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('globalSearch');

    if (searchInput) {
        // Function to perform search
        function performSearch() {
            const searchTerm = searchInput.value.toLowerCase();
            const searchableItems = document.querySelectorAll('.card-activity li'); // Target the visitor activity list items

            if (searchTerm === '') {
                // Show all items if search is empty
                searchableItems.forEach(item => {
                    item.style.display = '';
                });
            } else {
                searchableItems.forEach(item => {
                    const textContent = item.textContent.toLowerCase();
                    if (textContent.includes(searchTerm)) {
                        item.style.display = '';
                    } else {
                        item.style.display = 'none';
                    }
                });
            }
        }

        // Search on input
        searchInput.addEventListener('input', performSearch);

        // Optional: Search on Enter key
        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                performSearch();
            }
        });
    }
});
